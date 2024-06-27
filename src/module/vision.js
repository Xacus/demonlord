/* globals VisionMode, ColorAdjustmentsSamplerShader  */
export function registerVisionModes() {

  // Shadows as lit
  CONFIG.Canvas.visionModes.shadowsight = new VisionMode({
    id: "shadowsight",
    label: "DL.VisionShadowsight",
    canvas: {
      shader: ColorAdjustmentsSamplerShader,
      uniforms: { contrast: 0, saturation: 0, brightness: 0 }
    },
    lighting: {
      levels: {
        [VisionMode.LIGHTING_LEVELS.DIM]: VisionMode.LIGHTING_LEVELS.BRIGHT
      },
      background: {
        visibility: VisionMode.LIGHTING_VISIBILITY.REQUIRED,
      }
    },
    vision: {
      darkness: { adaptive: false },
      defaults: { attenuation: 0, contrast: 0, saturation: 0, brightness: 0 }
    }
  })

  // Shadows and darkness as lit (needs vision range to 20)
  CONFIG.Canvas.visionModes.darksight = new VisionMode({
    id: "darksight",
    label: "DL.VisionDarksight",
    canvas: {
      shader: ColorAdjustmentsSamplerShader,
      uniforms: { contrast: 0, saturation: 0, brightness: 0 }
    },
    lighting: {
      levels: {
        [VisionMode.LIGHTING_LEVELS.DIM]: VisionMode.LIGHTING_LEVELS.BRIGHT,
        [VisionMode.LIGHTING_LEVELS.UNLIT]: VisionMode.LIGHTING_LEVELS.DIM
      },
      background: {
        visibility: VisionMode.LIGHTING_VISIBILITY.REQUIRED,
      }
    },
    vision: {
      defaults: { attenuation: 0, contrast: 0, saturation: 0, brightness: 0 },
      darkness: { adaptive: false }
    }
  }),

  // Dim light + sense all
  CONFIG.Canvas.visionModes.sightless = new VisionMode({
    id: "sightless",
    label: "DL.VisionSightless",
    canvas: {
      shader: ColorAdjustmentsSamplerShader,
      uniforms: { contrast: 0, saturation: 0, brightness: 0 }
    },
    lighting: {
      levels: {
        [VisionMode.LIGHTING_LEVELS.BRIGHT]: VisionMode.LIGHTING_LEVELS.DIM,
        [VisionMode.LIGHTING_LEVELS.BRIGHTEST]: VisionMode.LIGHTING_LEVELS.DIM,
      }
    },
    vision: {
      darkness: { adaptive: false },
      defaults: { attenuation: 0, contrast: 0, saturation: 0, brightness: 0 }
    }
  })

  // Darkvision + sense all
  CONFIG.Canvas.visionModes.truesight = new VisionMode({
    id: "truesight",
    label: "DL.VisionTruesight",
    canvas: {
      shader: ColorAdjustmentsSamplerShader,
      uniforms: { contrast: 0, saturation: 0, brightness: 0 }
    },
    lighting: {
      levels: {
        [VisionMode.LIGHTING_LEVELS.DIM]: VisionMode.LIGHTING_LEVELS.BRIGHT,
        [VisionMode.LIGHTING_LEVELS.UNLIT]: VisionMode.LIGHTING_LEVELS.BRIGHT
      },
      background: {
        visibility: VisionMode.LIGHTING_VISIBILITY.REQUIRED,
      }
    },
    vision: {
      darkness: { adaptive: false },
      defaults: { attenuation: 0, contrast: 0, saturation: 0, brightness: 0 }
    }
  })
}