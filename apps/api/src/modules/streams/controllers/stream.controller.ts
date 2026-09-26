import { Controller, Get, Post, Put, Param, Body, Req, Res, Next } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from "../../../shared/errors/app-error.js";
import { tipEventBus, type TipFeedEvent } from "../../../shared/realtime/tip-event-bus.js";
import { tipPayoutRepository } from "../../tips/repositories/tip-payout.repository.js";
import { tipRepository } from "../../tips/repositories/tip.repository.js";
import { toTipPayoutResponse } from "../../tips/types/tip-payout.types.js";
import type { Tip, TipStatus } from "../../tips/types/tip.types.js";
import { streamService } from "../services/stream.service.js";
import { toStreamResponse } from "../types/stream.types.js";
import { streamPayoutConfigController as legacyConfigController } from './stream-payout-config.controller.legacy.js';

const HEARTBEAT_INTERVAL_MS = 20_000;

type TipFeedPayload = Omit<TipFeedEvent, "seq" | "emittedAt">;

async function tipToFeedPayload(tip: Tip): Promise<TipFeedPayload> {
  const payouts = await tipPayoutRepository.findByTipId(tip.id);

  return {
    streamId: tip.streamId!,
    tipId: tip.id,
    creatorId: tip.creatorId,
    fanUserId: tip.fanUserId,
    amount: tip.amount,
    status: tip.status as TipStatus,
    txHash: tip.txHash,
    failureReason: tip.failureReason,
    ...(payouts.length > 0 ? { payouts: payouts.map(toTipPayoutResponse) } : {}),
  };
}

function writeEvent(res: Response, payload: TipFeedPayload, seq?: number): void {
  if (seq !== undefined) {
    res.write(`id: ${seq}\n`);
  }
  res.write(`event: tip\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

@Controller('streams')
export class StreamController {
  @Post()
  async start(@Req() req: Request, @Body() body: any, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const hostUserId = (req as any).userId!;
      const { title } = body;
      const stream = await streamService.startStream(hostUserId, title);
      return res.status(201).json(toStreamResponse(stream));
    } catch (error) {
      next(error);
    }
  }

  @Post(':id/end')
  async end(@Param('id') id: string, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const hostUserId = (req as any).userId!;
      const stream = await streamService.endStream(id, hostUserId);
      return res.status(200).json(toStreamResponse(stream));
    } catch (error) {
      next(error);
    }
  }

  @Get(':id/tips')
  async streamTips(@Param('id') streamId: string, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const stream = await streamService.findById(streamId);
      if (!stream) {
        throw new AppError(404, "STREAM_NOT_FOUND", "Stream not found");
      }

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      res.flushHeaders();

      const backlog = await tipRepository.findByStreamId(streamId);
      for (const tip of backlog) {
        writeEvent(res, await tipToFeedPayload(tip));
      }

      const unsubscribe = tipEventBus.subscribe(streamId, (event) => {
        writeEvent(res, event, event.seq);
      });

      const heartbeat = setInterval(() => {
        res.write(": heartbeat\n\n");
      }, HEARTBEAT_INTERVAL_MS);

      req.on("close", () => {
        clearInterval(heartbeat);
        unsubscribe();
        res.end();
      });
    } catch (error) {
      next(error);
    }
  }

  @Put(':id/payout-config')
  async setPayoutConfig(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return legacyConfigController.set(req, res, next);
  }

  @Get(':id/payout-config')
  async getPayoutConfig(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return legacyConfigController.get(req, res, next);
  }
}
