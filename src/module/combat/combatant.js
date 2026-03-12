export class DLCombatant extends foundry.documents.Combatant {
    _onDelete(options, userId) {
        super._onDelete(options, userId)

        // If the combatant is deleted, we also delete its double if it exists
        if (this.actor.system.fastAndSlowTurn) {
            const doubleCombatants = game.combat.getCombatantsByToken(this.token).filter(c => c.id !== this.id)
            for (const double of doubleCombatants) {
                if (double) {
                    double.delete()
                }
            }
        }
    }
}
