export class DemonlordTokenDocument extends foundry.documents.TokenDocument {
    /** @override */
    prepareDerivedData() {
        super.prepareDerivedData()
        if (game.settings.get('demonlord', 'autoSizeTokens')) {
            const size = this.actor.system.characteristics.size

            let scale = Math.max(size, 0.5) // Foundry can't handle token scales smaller than 0.5, so we need to adjust the texture scale further
            let textureScale = 1

            if (size < 0.5) {
                textureScale = size * 2;
            }

            this.width = scale
            this.height = scale
            this.texture.scaleX = textureScale
            this.texture.scaleY = textureScale
        }
    }
}
