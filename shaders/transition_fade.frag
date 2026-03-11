#version 450

layout(location = 0) in vec2 v_uv;
layout(location = 0) out vec4 f_color;

layout(set = 0, binding = 0) uniform sampler2D u_old;
layout(set = 0, binding = 1) uniform sampler2D u_new;

layout(push_constant) uniform PushConstants {
    float progress;   // 0.0 → 1.0
    float angle;      // unused for fade
    float pos_x;      // unused for fade
    float pos_y;      // unused for fade
    float wave_x;     // unused for fade
    float wave_y;     // unused for fade
} pc;

void main() {
    vec4 old_color = texture(u_old, v_uv);
    vec4 new_color = texture(u_new, v_uv);
    f_color = mix(old_color, new_color, pc.progress);
}
