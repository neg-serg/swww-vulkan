#version 450

layout(location = 0) in vec2 v_uv;
layout(location = 0) out vec4 f_color;

layout(set = 0, binding = 0) uniform sampler2D u_old;
layout(set = 0, binding = 1) uniform sampler2D u_new;

layout(push_constant) uniform PushConstants {
    float progress;
    float angle;      // unused
    float pos_x;      // center X [0,1]
    float pos_y;      // center Y [0,1]
    float wave_x;
    float wave_y;
} pc;

void main() {
    // Circular grow from (pos_x, pos_y)
    vec2 center = vec2(pc.pos_x, pc.pos_y);
    float dist = distance(v_uv, center);

    // Max possible distance from center to any corner
    float max_dist = length(vec2(
        max(center.x, 1.0 - center.x),
        max(center.y, 1.0 - center.y)
    ));

    float radius = pc.progress * max_dist;
    float edge = 0.02;
    float mask = smoothstep(radius - edge, radius + edge, dist);

    vec4 old_color = texture(u_old, v_uv);
    vec4 new_color = texture(u_new, v_uv);
    f_color = mix(new_color, old_color, mask);
}
