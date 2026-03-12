#version 450
// GL Transitions — cube by gre
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

const float persp = 0.7;
const float unzoom = 0.3;
const float reflection = 0.4;
const float floating = 3.0;

vec2 project(vec2 p) {
    return p * vec2(1.0, -1.2) + vec2(0.0, -floating / 100.0);
}

bool inBounds(vec2 p) {
    return all(lessThan(vec2(0.0), p)) && all(lessThan(p, vec2(1.0)));
}

vec4 bgColor(vec2 p, vec2 pfr, vec2 pto) {
    vec4 c = vec4(0.0, 0.0, 0.0, 1.0);
    pfr = project(pfr);
    if (inBounds(pfr)) {
        c += mix(vec4(0.0), getFromColor(pfr), reflection * mix(1.0, 0.0, pfr.y));
    }
    pto = project(pto);
    if (inBounds(pto)) {
        c += mix(vec4(0.0), getToColor(pto), reflection * mix(1.0, 0.0, pto.y));
    }
    return c;
}

vec2 xskew(vec2 p, float persp_val, float center) {
    float x = mix(p.x, 1.0 - p.x, center);
    return (
        (
            vec2(x, (p.y - 0.5 * (1.0 - persp_val) * x) / (1.0 + (persp_val - 1.0) * x))
            - vec2(0.5 - distance(center, 0.5), 0.0)
        )
        * vec2(0.5 / distance(center, 0.5) * (center < 0.5 ? 1.0 : -1.0), 1.0)
        + vec2(center < 0.5 ? 0.0 : 1.0, 0.0)
    );
}

vec4 transition(vec2 op) {
    float uz = unzoom * 2.0 * (0.5 - distance(0.5, pc.progress));
    vec2 p = -uz * 0.5 + (1.0 + uz) * op;
    vec2 fromP = xskew(
        (p - vec2(pc.progress, 0.0)) / vec2(1.0 - pc.progress, 1.0),
        1.0 - mix(pc.progress, 0.0, persp),
        0.0
    );
    vec2 toP = xskew(
        p / vec2(pc.progress, 1.0),
        mix(pow(pc.progress, 2.0), 1.0, persp),
        1.0
    );
    if (inBounds(fromP)) {
        return getFromColor(fromP);
    }
    else if (inBounds(toP)) {
        return getToColor(toP);
    }
    return bgColor(op, fromP, toP);
}

void main() {
    f_color = transition(v_uv);
}
