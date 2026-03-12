#version 450
// GL Transitions — Rolls by Mark Craig
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

const int type = 0;
const bool RotDown = false;

#define M_PI 3.14159265358979323846

vec4 transition(vec2 uv) {
    float theta, c1, s1;
    vec2 iResolution = vec2(pc.screen_aspect, 1.0);
    vec2 uvi;
    if (type == 0) { theta = (RotDown ? M_PI : -M_PI) / 2.0 * pc.progress; uvi.x = 1.0 - uv.x; uvi.y = uv.y; }
    else if (type == 1) { theta = (RotDown ? M_PI : -M_PI) / 2.0 * pc.progress; uvi = uv; }
    else if (type == 2) { theta = (RotDown ? -M_PI : M_PI) / 2.0 * pc.progress; uvi.x = uv.x; uvi.y = 1.0 - uv.y; }
    else if (type == 3) { theta = (RotDown ? -M_PI : M_PI) / 2.0 * pc.progress; uvi = 1.0 - uv; }
    c1 = cos(theta); s1 = sin(theta);
    vec2 uv2;
    uv2.x = (uvi.x * iResolution.x * c1 - uvi.y * iResolution.y * s1);
    uv2.y = (uvi.x * iResolution.x * s1 + uvi.y * iResolution.y * c1);
    if ((uv2.x >= 0.0) && (uv2.x <= iResolution.x) && (uv2.y >= 0.0) && (uv2.y <= iResolution.y)) {
        uv2 /= iResolution;
        if (type == 0) { uv2.x = 1.0 - uv2.x; }
        else if (type == 2) { uv2.y = 1.0 - uv2.y; }
        else if (type == 3) { uv2 = 1.0 - uv2; }
        return getFromColor(uv2);
    }
    return getToColor(uv);
}

void main() {
    f_color = transition(v_uv);
}
