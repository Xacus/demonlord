export default class DLActiveEffect extends foundry.documents.ActiveEffect {
    /**
     * Handle expiration logic for custom expiry events
     * @param {*} event
     * @param {*} context
     * @returns
     * @inheritdoc
     */
    isExpiryEvent(event, context) {
        const newEvents = new Set(['turnStartSource', 'turnEndSource', 'nextAttackRoll', 'nextChallengeRoll', 'nextD20Roll', 'nextDamageRoll', 'restComplete'])

        if (!newEvents.has(event) || !newEvents.has(this.duration.expiry)) return super.isExpiryEvent(event, context)

        switch (event) {
            case 'turnStartSource':
                return this.origin?.startsWith(context.actorUuid)
            case 'turnEndSource':
                // Do not delete effects which are created in the same turn and round.
                if (context.combat.round === this.start.round && context.combat.turn === this.start.turn + 1 || context.combat.round === this.start.round + 1 && context.combat.turn === 0) return false
                return this.origin?.startsWith(context.actorUuid)

            case 'nextAttackRoll':
                return this.actor.uuid === context.actorUuid

                case 'nextChallengeRoll':
                return this.actor.uuid === context.actorUuid

             case 'nextD20Roll':
                return this.actor.uuid === context.actorUuid

            case 'nextDamageRoll':
                return this.actor.uuid === context.actorUuid

            case 'restComplete':
                return this.actor.uuid === context.actorUuid

        }
    }
}
