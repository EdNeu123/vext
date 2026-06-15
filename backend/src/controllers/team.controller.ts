import { Response, NextFunction } from 'express';
import { teamService } from '../services/team.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { apiResponse } from '../utils/helpers';

export class TeamController {
  /** GET /teams — lista equipes do usuário logado */
  async listMyTeams(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await teamService.listMyTeams(req.user!.id))); }
    catch (e) { next(e); }
  }

  /** POST /teams — cria nova equipe */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const team = await teamService.create(req.body.name, req.user!.id, req.user!.name);
      res.status(201).json(apiResponse(team, 'Equipe criada'));
    } catch (e) { next(e); }
  }

  /** GET /teams/:id — detalhes da equipe (precisa ser membro) */
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await teamService.getById(req.teamId!))); }
    catch (e) { next(e); }
  }

  /** PUT /teams/:id — atualiza nome (admin only) */
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await teamService.update(req.teamId!, req.body, req.user!.id, req.user!.name);
      res.json(apiResponse(null, 'Equipe atualizada'));
    } catch (e) { next(e); }
  }

  /** POST /teams/join — entra por orgCode */
  async joinByOrgCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const team = await teamService.joinByOrgCode(req.body.orgCode, req.user!.id);
      res.json(apiResponse(team, 'Você entrou na equipe'));
    } catch (e) { next(e); }
  }

  /** GET /teams/:id/members */
  async listMembers(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await teamService.listMembers(req.teamId!))); }
    catch (e) { next(e); }
  }

  /** GET /teams/:id/ranking */
  async getSellerRanking(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await teamService.getSellerRanking(req.teamId!))); }
    catch (e) { next(e); }
  }

  /** PUT /teams/:id/members/:userId — promove/rebaixa entre moderator e seller (admin only) */
  async updateMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await teamService.updateMember(
        req.teamId!, Number(req.params.userId),
        req.body.role, req.user!.id, req.user!.name
      );
      res.json(apiResponse(null, 'Membro atualizado'));
    } catch (e) { next(e); }
  }

  /** DELETE /teams/:id/members/:userId — admin ou moderator (regras de hierarquia no service) */
  async removeMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await teamService.removeMember(
        req.teamId!, Number(req.params.userId),
        req.user!.id, req.user!.name,
        req.teamRole as 'admin' | 'moderator'
      );
      res.json(apiResponse(null, 'Membro removido'));
    } catch (e) { next(e); }
  }

  /** PUT /teams/:id/transfer-ownership — transfere a posse (admin only) */
  async transferOwnership(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await teamService.transferOwnership(
        req.teamId!, req.body.newOwnerUserId, req.user!.id, req.user!.name
      );
      res.json(apiResponse(null, 'Posse da equipe transferida'));
    } catch (e) { next(e); }
  }
}

export const teamController = new TeamController();
