/* globals VisionMode, ColorAdjustmentsSamplerShader  */
export function registerVisionModes() {

  // Shadows as lit
  CONFIG.Canvas.visionModes.shadowsight = new foundry.canvas.perception.VisionMode({
    id: "shadowsight",
    label: "DL.VisionShadowsight",
    canvas: {
      shader: foundry.canvas.rendering.shaders.ColorAdjustmentsSamplerShader,
      uniforms: { contrast: 0, saturation: 0, brightness: 0 }
    },
    lighting: {
      levels: {
        [foundry.canvas.perception.VisionMode.LIGHTING_LEVELS.DIM]: foundry.canvas.perception.VisionMode.LIGHTING_LEVELS.BRIGHT
      },
      background: {
        visibility: foundry.canvas.perception.VisionMode.LIGHTING_VISIBILITY.REQUIRED,
      }
    },
    vision: {
      darkness: { adaptive: false },
      defaults: { attenuation: 0, contrast: 0, saturation: 0, brightness: 0 }
    }
  })

  // Shadows and darkness as lit (needs vision range to 20)
  CONFIG.Canvas.visionModes.darksight = new foundry.canvas.perception.VisionMode({
    id: "darksight",
    label: "DL.VisionDarksight",
    canvas: {
      shader: foundry.canvas.rendering.shaders.ColorAdjustmentsSamplerShader,
      uniforms: { contrast: 0, saturation: 0, brightness: 0 }
    },
    lighting: {
      levels: {
        [foundry.canvas.perception.VisionMode.LIGHTING_LEVELS.DIM]: foundry.canvas.perception.VisionMode.LIGHTING_LEVELS.BRIGHT,
        [foundry.canvas.perception.VisionMode.LIGHTING_LEVELS.UNLIT]: foundry.canvas.perception.VisionMode.LIGHTING_LEVELS.DIM
      },
      background: {
        visibility: foundry.canvas.perception.VisionMode.LIGHTING_VISIBILITY.REQUIRED,
      }
    },
    vision: {
      defaults: { attenuation: 0, contrast: 0, saturation: 0, brightness: 0 },
      darkness: { adaptive: false }
    }
  }),

  // Dim light + sense all
  CONFIG.Canvas.visionModes.sightless = new foundry.canvas.perception.VisionMode({
    id: "sightless",
    label: "DL.VisionSightless",
    canvas: {
      shader: foundry.canvas.rendering.shaders.ColorAdjustmentsSamplerShader,
      uniforms: { contrast: 0, saturation: 0, brightness: 0 }
    },
    lighting: {
      levels: {
        [foundry.canvas.perception.VisionMode.LIGHTING_LEVELS.BRIGHT]: foundry.canvas.perception.VisionMode.LIGHTING_LEVELS.DIM,
        [foundry.canvas.perception.VisionMode.LIGHTING_LEVELS.BRIGHTEST]: foundry.canvas.perception.VisionMode.LIGHTING_LEVELS.DIM,
      }
    },
    vision: {
      darkness: { adaptive: false },
      defaults: { attenuation: 0, contrast: 0, saturation: 0, brightness: 0 }
    }
  })

  // Darkvision + sense all
  CONFIG.Canvas.visionModes.truesight = new foundry.canvas.perception.VisionMode({
    id: "truesight",
    label: "DL.VisionTruesight",
    canvas: {
      shader: foundry.canvas.rendering.shaders.ColorAdjustmentsSamplerShader,
      uniforms: { contrast: 0, saturation: 0, brightness: 0 }
    },
    lighting: {
      levels: {
        [foundry.canvas.perception.VisionMode.LIGHTING_LEVELS.DIM]: foundry.canvas.perception.VisionMode.LIGHTING_LEVELS.BRIGHT,
        [foundry.canvas.perception.VisionMode.LIGHTING_LEVELS.UNLIT]: foundry.canvas.perception.VisionMode.LIGHTING_LEVELS.BRIGHT
      },
      background: {
        visibility: foundry.canvas.perception.VisionMode.LIGHTING_VISIBILITY.REQUIRED,
      }
    },
    vision: {
      darkness: { adaptive: false },
      defaults: { attenuation: 0, contrast: 0, saturation: 0, brightness: 0 }
    }
  })
}