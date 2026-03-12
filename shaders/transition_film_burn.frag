#version 450
// GL Transitions — FilmBurn by Anastasia Dunbar
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

const float Seed = 2.31;
const float pi = 3.14159265358979323;

float sigmoid(float x, float a) {
    float b = pow(x * 2.0, a) / 2.0;
    if (x > 0.5) {
        b = 1.0 - pow(2.0 - (x * 2.0), a) / 2.0;
    }
    return b;
}

float rand(float co) {
    return fract(sin((co * 24.9898) + Seed) * 43758.5453);
}

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float apow(float a, float b) { return pow(abs(a), b) * sign(b); }
vec3 pow3(vec3 a, vec3 b) { return vec3(apow(a.r, b.r), apow(a.g, b.g), apow(a.b, b.b)); }
float smooth_mix(float a, float b, float c) { return mix(a, b, sigmoid(c, 2.0)); }

float random(vec2 co, float shft) {
    co += 10.0;
    return smooth_mix(
        fract(sin(dot(co.xy, vec2(12.9898 + (floor(shft) * 0.5), 78.233 + Seed))) * 43758.5453),
        fract(sin(dot(co.xy, vec2(12.9898 + (floor(shft + 1.0) * 0.5), 78.233 + Seed))) * 43758.5453),
        fract(shft)
    );
}

float smooth_random(vec2 co, float shft) {
    return smooth_mix(
        smooth_mix(random(floor(co), shft), random(floor(co + vec2(1.0, 0.0)), shft), fract(co.x)),
        smooth_mix(random(floor(co + vec2(0.0, 1.0)), shft), random(floor(co + vec2(1.0, 1.0)), shft), fract(co.x)),
        fract(co.y)
    );
}

vec4 sampleBlend(vec2 p) {
    return mix(getFromColor(p), getToColor(p), sigmoid(pc.progress, 10.0));
}

vec4 transition(vec2 p) {
    vec3 f = vec3(0.0);
    for (float i = 0.0; i < 13.0; i++) {
        f += sin(((p.x * rand(i) * 6.0) + (pc.progress * 8.0)) + rand(i + 1.43)) * sin(((p.y * rand(i + 4.4) * 6.0) + (pc.progress * 6.0)) + rand(i + 2.4));
        f += 1.0 - clamp(length(p - vec2(smooth_random(vec2(pc.progress * 1.3), i + 1.0), smooth_random(vec2(pc.progress * 0.5), i + 6.25))) * mix(20.0, 70.0, rand(i)), 0.0, 1.0);
    }
    f += 4.0;
    f /= 11.0;
    f = pow3(f * vec3(1.0, 0.7, 0.6), vec3(1.0, 2.0 - sin(pc.progress * pi), 1.3));
    f *= sin(pc.progress * pi);

    p -= 0.5;
    p *= 1.0 + (smooth_random(vec2(pc.progress * 5.0), 6.3) * sin(pc.progress * pi) * 0.05);
    p += 0.5;

    vec4 blurred_image = vec4(0.0);
    float bluramount = sin(pc.progress * pi) * 0.03;
    const float repeats = 50.0;
    for (float i = 0.0; i < repeats; i++) {
        vec2 q = vec2(cos(radians((i / repeats) * 360.0)), sin(radians((i / repeats) * 360.0))) * (rand(vec2(i, p.x + p.y)) + bluramount);
        vec2 uv2 = p + (q * bluramount);
        blurred_image += sampleBlend(uv2);
    }
    blurred_image /= repeats;

    return blurred_image + vec4(f, 0.0);
}

void main() {
    f_color = transition(v_uv);
}
