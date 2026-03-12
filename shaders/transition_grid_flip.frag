#version 450
// GL Transitions — GridFlip by TimDonselaar
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

const ivec2 size = ivec2(4);
const float pause = 0.1;
const float dividerWidth = 0.05;
const vec4 bgcolor = vec4(0.0, 0.0, 0.0, 1.0);
const float randomness = 0.1;

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float getDelta(vec2 p) {
    vec2 rectanglePos = floor(vec2(size) * p);
    vec2 rectangleSize = vec2(1.0 / float(size.x), 1.0 / float(size.y));
    float top = rectangleSize.y * (rectanglePos.y + 1.0);
    float bottom = rectangleSize.y * rectanglePos.y;
    float left = rectangleSize.x * rectanglePos.x;
    float right = rectangleSize.x * (rectanglePos.x + 1.0);
    float minX = min(abs(p.x - left), abs(p.x - right));
    float minY = min(abs(p.y - top), abs(p.y - bottom));
    return min(minX, minY);
}

float getDividerSize() {
    vec2 rectangleSize = vec2(1.0 / float(size.x), 1.0 / float(size.y));
    return min(rectangleSize.x, rectangleSize.y) * dividerWidth;
}

vec4 transition(vec2 p) {
    if (pc.progress < pause) {
        float currentProg = pc.progress / pause;
        float a = 1.0;
        if (getDelta(p) < getDividerSize()) {
            a = 1.0 - currentProg;
        }
        return mix(bgcolor, getFromColor(p), a);
    }
    else if (pc.progress < 1.0 - pause) {
        if (getDelta(p) < getDividerSize()) {
            return bgcolor;
        } else {
            float currentProg = (pc.progress - pause) / (1.0 - pause * 2.0);
            vec2 q = p;
            vec2 rectanglePos = floor(vec2(size) * q);

            float r = rand(rectanglePos) - randomness;
            float cp = smoothstep(0.0, 1.0 - r, currentProg);

            float rectangleSize = 1.0 / float(size.x);
            float delta = rectanglePos.x * rectangleSize;
            float offset = rectangleSize / 2.0 + delta;

            p.x = (p.x - offset) / abs(cp - 0.5) * 0.5 + offset;
            vec4 a = getFromColor(p);
            vec4 b = getToColor(p);

            float s = step(abs(float(size.x) * (q.x - delta) - 0.5), abs(cp - 0.5));
            return mix(bgcolor, mix(b, a, step(cp, 0.5)), s);
        }
    }
    else {
        float currentProg = (pc.progress - 1.0 + pause) / pause;
        float a = 1.0;
        if (getDelta(p) < getDividerSize()) {
            a = currentProg;
        }
        return mix(bgcolor, getToColor(p), a);
    }
}

void main() {
    f_color = transition(v_uv);
}
