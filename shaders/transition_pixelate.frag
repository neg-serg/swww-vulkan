#version 450

layout(location = 0) in vec2 v_uv;
layout(location = 0) out vec4 f_color;

layout(set = 0, binding = 0) uniform sampler2D u_old;
layout(set = 0, binding = 1) uniform sampler2D u_new;

layout(push_constant) uniform PushConstants {
    float progress;
    float angle;
    float pos_x;
    float pos_y;
    float wave_x;
    float wave_y;
    uint old_resize_mode;
    float old_img_aspect;
    uint new_resize_mode;
    float new_img_aspect;
    float screen_aspect;
} pc;

bool apply_resize(inout vec2 uv, uint resize_mode, float img_aspect, float scr_aspect) {
    if (resize_mode == 0u) {
        if (img_aspect > scr_aspect) {
            float scale = scr_aspect / img_aspect;
            uv.x = uv.x * scale + (1.0 - scale) * 0.5;
        } else {
            float scale = img_aspect / scr_aspect;
            uv.y = uv.y * scale + (1.0 - scale) * 0.5;
        }
    } else if (resize_mode == 1u) {
        if (img_aspect > scr_aspect) {
            float scale = scr_aspect / img_aspect;
            float offset = (1.0 - scale) * 0.5;
            if (uv.y < offset || uv.y > 1.0 - offset) return false;
            uv.y = (uv.y - offset) / scale;
        } else {
            float scale = img_aspect / scr_aspect;
            float offset = (1.0 - scale) * 0.5;
            if (uv.x < offset || uv.x > 1.0 - offset) return false;
            uv.x = (uv.x - offset) / scale;
        }
    }
    return true;
}

void main() {
    // Pixelation intensity: peaks at progress=0.5, zero at 0.0 and 1.0
    float intensity = 1.0 - abs(2.0 * pc.progress - 1.0);
    // Grid size ranges from 512 (barely visible) down to 8 (very blocky)
    float grid_size = mix(512.0, 8.0, intensity);

    // Quantize UVs to grid
    vec2 pixelated_uv = floor(v_uv * grid_size) / grid_size;

    // First half: pixelate old image; second half: pixelate new image
    bool show_new = pc.progress >= 0.5;

    vec2 uv = pixelated_uv;
    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);

    if (show_new) {
        if (apply_resize(uv, pc.new_resize_mode, pc.new_img_aspect, pc.screen_aspect))
            color = texture(u_new, uv);
    } else {
        if (apply_resize(uv, pc.old_resize_mode, pc.old_img_aspect, pc.screen_aspect))
            color = texture(u_old, uv);
    }

    f_color = color;
}
