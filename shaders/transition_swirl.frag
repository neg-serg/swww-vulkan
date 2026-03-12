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
    float wave_x;     // swirl strength (default 20)
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

const float PI = 3.14159265358979;

void main() {
    vec2 center = vec2(pc.pos_x, pc.pos_y);
    vec2 delta = v_uv - center;
    float dist = length(delta);

    // Swirl strength peaks at progress=0.5, zero at boundaries
    float strength = pc.wave_x * 0.15 * sin(pc.progress * PI);

    // Rotation decreases with distance from center
    float max_radius = 0.8;
    float falloff = clamp(1.0 - dist / max_radius, 0.0, 1.0);
    float rotation = strength * falloff * falloff;

    // Rotate UV around center
    float s = sin(rotation);
    float c = cos(rotation);
    vec2 swirled_uv = center + vec2(
        delta.x * c - delta.y * s,
        delta.x * s + delta.y * c
    );

    // Clamp to valid UV range
    swirled_uv = clamp(swirled_uv, vec2(0.0), vec2(1.0));

    // Wide smooth crossfade — image swap is hidden by swirl distortion
    float blend = smoothstep(0.25, 0.75, pc.progress);

    vec2 old_uv = swirled_uv;
    vec2 new_uv = swirled_uv;

    vec4 old_color = vec4(0.0, 0.0, 0.0, 1.0);
    vec4 new_color = vec4(0.0, 0.0, 0.0, 1.0);

    if (apply_resize(old_uv, pc.old_resize_mode, pc.old_img_aspect, pc.screen_aspect))
        old_color = texture(u_old, old_uv);
    if (apply_resize(new_uv, pc.new_resize_mode, pc.new_img_aspect, pc.screen_aspect))
        new_color = texture(u_new, new_uv);

    f_color = mix(old_color, new_color, blend);
}
