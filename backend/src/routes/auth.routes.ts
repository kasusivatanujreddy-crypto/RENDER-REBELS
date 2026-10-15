import { Router } from "express";
import { db } from "../services/db.service.js";

export const authRouter = Router();

authRouter.get("/me", async (req, res, next) => {
  try {
    const user = req.user!;
    const organization = await db.getOrganization(user.organizationId);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        organization,
      },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/organizations", async (req, res, next) => {
  try {
    const orgs = await db.getOrganizations();
    res.json({
      success: true,
      data: orgs,
    });
  } catch (err) {
    next(err);
  }
});
