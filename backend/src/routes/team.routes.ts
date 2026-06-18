import { Router } from 'express';
import { authenticate, validate } from '../middlewares';
import { requireTeamAccess, requireTeamAdmin, requireTeamStaff } from '../middlewares/team.middleware';
import { teamController } from '../controllers/team.controller';
import {
  createTeamSchema, updateTeamSchema, updateTeamMemberSchema,
  transferOwnershipSchema, joinByOrgCodeSchema,
} from '../models/schemas';

const router = Router();

// Rotas que NÃO precisam de X-Team-ID (pré-seleção de equipe)
router.get('/',       authenticate, (req, res, next) => teamController.listMyTeams(req as any, res, next));
router.post('/',      authenticate, validate(createTeamSchema), (req, res, next) => teamController.create(req as any, res, next));
router.post('/join',  authenticate, validate(joinByOrgCodeSchema), (req, res, next) => teamController.joinByOrgCode(req as any, res, next));

// Rotas que exigem X-Team-ID (usuário já selecionou a equipe)
router.get('/:id',           authenticate, requireTeamAccess, (req, res, next) => teamController.getById(req as any, res, next));
router.put('/:id',           authenticate, requireTeamAccess, requireTeamAdmin, validate(updateTeamSchema), (req, res, next) => teamController.update(req as any, res, next));
router.get('/:id/members',   authenticate, requireTeamAccess, (req, res, next) => teamController.listMembers(req as any, res, next));
router.get('/:id/ranking',   authenticate, requireTeamAccess, (req, res, next) => teamController.getSellerRanking(req as any, res, next));

// Convidar/remover membros: admin OU moderator (hierarquia validada no service)
router.delete('/:id/members/:userId', authenticate, requireTeamAccess, requireTeamStaff, (req, res, next) => teamController.removeMember(req as any, res, next));

// Promover/rebaixar (moderator <-> seller) e transferir posse: admin only
router.put('/:id/members/:userId',    authenticate, requireTeamAccess, requireTeamAdmin, validate(updateTeamMemberSchema), (req, res, next) => teamController.updateMember(req as any, res, next));
router.put('/:id/transfer-ownership', authenticate, requireTeamAccess, requireTeamAdmin, validate(transferOwnershipSchema), (req, res, next) => teamController.transferOwnership(req as any, res, next));

export default router;
