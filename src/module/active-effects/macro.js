export class DLMacro {
  getMacroArguments({ actor }) {
    return mergeObject({
      token: ChatMessage.getSpeaker({ actor }).token,
      actor: actor.id,
    }, {}, { overwrite: false });
  }

  async on(actor, effectData) {
    const changes = effectData?.changes?.filter(c => c.key === 'data.misc.macroOnApply') ?? []
    if (changes.length === 0 ) {
      return
    }
    return this.executeMacro(actor, changes)
  }
  async off(actor, effectData) {
    const changes = effectData?.changes?.filter(c => c.key === 'data.misc.macroOnRemove') ?? []
    if (changes.length === 0 ) {
      return
    }
    return this.executeMacro(actor, changes)
  }

  async executeMacro(actor, changes, context) {
    for (const change of changes) {
      const macro = game.macros.getName(change.value)
      if (!macro) {
        ui.notifications.warn(`macro.execute | No macro ${change.value} found`)
        console.error(`macro.execute | No macro ${change.value} found`);
        continue;
      }
      const args = this.getMacroArguments({ actor, ...context })
      await macro.execute(args)
    }
  }
}
