#version 450
// GL Transitions — swap by gre
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

const float reflection = 0.4;
const float perspective = 0.2;
const float depth = 3.0;

const vec4 black = vec4(0.0, 0.0, 0.0, 1.0);
const vec2 boundMin = vec2(0.0, 0.0);
const vec2 boundMax = vec2(1.0, 1.0);

bool inBounds(vec2 p) {
    return all(lessThan(boundMin, p)) && all(lessThan(p, boundMax));
}

vec2 project(vec2 p) {
    return p * vec2(1.0, -1.2) + vec2(0.0, -0.02);
}

vec4 bgColor(vec2 p, vec2 pfr, vec2 pto) {
    vec4 c = black;
    pfr = project(pfr);
    if (inBounds(pfr)) {
        c += mix(black, getFromColor(pfr), reflection * mix(1.0, 0.0, pfr.y));
    }
    pto = project(pto);
    if (inBounds(pto)) {
        c += mix(black, getToColor(pto), reflection * mix(1.0, 0.0, pto.y));
    }
    return c;
}

vec4 transition(vec2 p) {
    vec2 pfr, pto = vec2(-1.0);

    float size = mix(1.0, depth, pc.progress);
    float persp = perspective * pc.progress;
    pfr = (p + vec2(-0.0, -0.5)) * vec2(size / (1.0 - perspective * pc.progress), size / (1.0 - size * persp * p.x)) + vec2(0.0, 0.5);

    size = mix(1.0, depth, 1.0 - pc.progress);
    persp = perspective * (1.0 - pc.progress);
    pto = (p + vec2(-1.0, -0.5)) * vec2(size / (1.0 - perspective * (1.0 - pc.progress)), size / (1.0 - size * persp * (0.5 - p.x))) + vec2(1.0, 0.5);

    if (pc.progress < 0.5) {
        if (inBounds(pfr)) {
            return getFromColor(pfr);
        }
        if (inBounds(pto)) {
            return getToColor(pto);
        }
    }
    if (inBounds(pto)) {
        return getToColor(pto);
    }
    if (inBounds(pfr)) {
        return getFromColor(pfr);
    }
    return bgColor(p, pfr, pto);
}

void main() {
    f_color = transition(v_uv);
}
