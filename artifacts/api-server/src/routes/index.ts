import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import transfersRouter from "./transfers";
import gamesRouter from "./games";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(transfersRouter);
router.use(gamesRouter);

export default router;
