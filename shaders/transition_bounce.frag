#version 450
// GL Transitions — Bounce by Adrian Purser
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

const vec4 shadow_colour = vec4(0.0, 0.0, 0.0, 0.6);
const float shadow_height = 0.075;
const float bounces = 3.0;

const float PI = 3.14159265358;

vec4 transition(vec2 uv) {
    float time = pc.progress;
    float stime = sin(time * PI / 2.0);
    float phase = time * PI * bounces;
    float y = (abs(cos(phase))) * (1.0 - stime);
    float d = uv.y - y;
    return mix(
        mix(
            getToColor(uv),
            shadow_colour,
            step(d, shadow_height) * (1.0 - mix(
                ((d / shadow_height) * shadow_colour.a) + (1.0 - shadow_colour.a),
                1.0,
                smoothstep(0.95, 1.0, pc.progress)
            ))
        ),
        getFromColor(vec2(uv.x, uv.y + (1.0 - y))),
        step(d, 0.0)
    );
}

void main() {
    f_color = transition(v_uv);
}
