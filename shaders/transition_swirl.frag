#version 450
// GL Transitions — Swirl by Sergey Kosarevsky
// License: MIT
// Source: https://github.com/gl-transitions/gl-transitions

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

// Helper functions to sample with resize
vec4 getFromColor(vec2 uv) {
    vec2 ruv = uv;
    if (!apply_resize(ruv, pc.old_resize_mode, pc.old_img_aspect, pc.screen_aspect))
        return vec4(0.0, 0.0, 0.0, 1.0);
    return texture(u_old, ruv);
}

vec4 getToColor(vec2 uv) {
    vec2 ruv = uv;
    if (!apply_resize(ruv, pc.new_resize_mode, pc.new_img_aspect, pc.screen_aspect))
        return vec4(0.0, 0.0, 0.0, 1.0);
    return texture(u_new, ruv);
}

// --- Transition logic below ---

vec4 transition(vec2 UV) {
    float Radius = 1.0;
    float T = pc.progress;

    UV -= vec2(0.5, 0.5);
    float Dist = length(UV);

    if (Dist < Radius) {
        float Percent = (Radius - Dist) / Radius;
        float A = (T <= 0.5) ? mix(0.0, 1.0, T / 0.5) : mix(1.0, 0.0, (T - 0.5) / 0.5);
        float Theta = Percent * Percent * A * 8.0 * 3.14159;
        float S = sin(Theta);
        float C = cos(Theta);
        UV = vec2(dot(UV, vec2(C, -S)), dot(UV, vec2(S, C)));
    }
    UV += vec2(0.5, 0.5);

    vec4 C0 = getFromColor(UV);
    vec4 C1 = getToColor(UV);

    return mix(C0, C1, T);
}

void main() {
    f_color = transition(v_uv);
}
