#version 450

layout(location = 0) in vec2 v_uv;
layout(location = 0) out vec4 f_color;

layout(set = 0, binding = 0) uniform sampler2D u_old;
layout(set = 0, binding = 1) uniform sampler2D u_new;

layout(push_constant) uniform PushConstants {
    float progress;
    float angle;
    float pos_x;      // center X [0,1]
    float pos_y;      // center Y [0,1]
    float wave_x;
    float wave_y;
} pc;

void main() {
    // Outside-in reveal: starts from edges, converges to center
    vec2 center = vec2(pc.pos_x, pc.pos_y);
    float dist = distance(v_uv, center);

    float max_dist = length(vec2(
        max(center.x, 1.0 - center.x),
        max(center.y, 1.0 - center.y)
    ));

    // Invert: reveal from outside (far from center first)
    float radius = (1.0 - pc.progress) * max_dist;
    float edge = 0.02;
    float mask = smoothstep(radius - edge, radius + edge, dist);

    vec4 old_color = texture(u_old, v_uv);
    vec4 new_color = texture(u_new, v_uv);
    f_color = mix(old_color, new_color, mask);
}
