import { Router } from "express";
import { db } from "../services/db.service.js";
import { FindingReviewDecisionSchema } from "@visioniq/shared";

export const findingsRouter = Router();

// Review a finding (confirm, reject, correct)
findingsRouter.post("/:id/review", async (req, res, next) => {
  try {
    const validated = FindingReviewDecisionSchema.parse(req.body);
    const findingId = req.params.id;
    const userId = req.user!.id;

    const updated = await db.updateFindingReview(findingId, validated.decision, {
      correctedCategory: validated.correctedCategory,
      correctedSeverity: validated.correctedSeverity,
      notes: validated.reviewerNotes,
      reviewerId: userId,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Finding not found." },
      });
    }

    res.json({
      success: true,
      data: updated,
      message: `Finding marked as ${validated.decision}.`,
    });
  } catch (err) {
    next(err);
  }
});
