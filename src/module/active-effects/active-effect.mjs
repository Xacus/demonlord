export default class DLActiveEffect extends foundry.documents.ActiveEffect {
    /**
     * Handle expiration logic for custom expiry events
     * @param {*} event
     * @param {*} context
     * @returns
     * @inheritdoc
     */
    isExpiryEvent(event, context) {
        // Special handling "1 Round" duration -> Demon Lord page 113
        if (this.duration.value === 1 && this.duration.units === 'rounds') {
            if (event === 'roundEnd' && context.combat.round >= this.start.round + 1) return true
            else return false
        }

        if (event === 'roundEnd' && this.duration.expiry === 'nextRoundEnd') return this.start.round+1 <= game.combat.round-1
        const newEvents = new Set(Object.keys(CONFIG.ActiveEffect.expiryEvents))

        if (!newEvents.has(event) || !newEvents.has(this.duration.expiry)) return super.isExpiryEvent(event, context)

        switch (event) {
            case 'turnStartSource':
                if (this.start.round === null) this.start.round = 1
                return this.origin?.startsWith(context.origin) && event === this.duration.expiry && context.combat.round >= this.start.round+1
                
            case 'turnEndSource':
                if (this.start.round === null) this.start.round = 1
                if (this.start.turn === null) this.start.turn = 1
                if (context.combat.round === this.start.round) return false
                return this.origin?.startsWith(context.origin) && event === this.duration.expiry

            case 'nextAttackRoll':
                return this.actor.uuid === context.actorUuid && event === this.duration.expiry

            case 'nextChallengeRoll':
                return this.actor.uuid === context.actorUuid && event === this.duration.expiry

            case 'nextD20Roll':
                return this.actor.uuid === context.actorUuid && event === this.duration.expiry

            case 'nextDamageRoll':
                return this.actor.uuid === context.actorUuid && event === this.duration.expiry

            case 'restComplete':
                return this.actor.uuid === context.actorUuid && event === this.duration.expiry

            case 'takesDamage':
                return this.actor.uuid === context.actorUuid && event === this.duration.expiry
        }
    }
}
