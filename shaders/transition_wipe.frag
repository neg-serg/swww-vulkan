#version 450

layout(location = 0) in vec2 v_uv;
layout(location = 0) out vec4 f_color;

layout(set = 0, binding = 0) uniform sampler2D u_old;
layout(set = 0, binding = 1) uniform sampler2D u_new;

layout(push_constant) uniform PushConstants {
    float progress;
    float angle;      // wipe direction in degrees
    float pos_x;
    float pos_y;
    float wave_x;
    float wave_y;
} pc;

void main() {
    // Directional wipe: project UV onto wipe direction vector
    float rad = radians(pc.angle);
    vec2 direction = vec2(cos(rad), sin(rad));

    // Project UV onto direction, normalized to [0,1]
    float proj = dot(v_uv, direction);
    float max_proj = abs(direction.x) + abs(direction.y);
    float t = proj / max_proj;

    // Smooth edge (2% of transition width)
    float edge = 0.02;
    float mask = smoothstep(pc.progress - edge, pc.progress + edge, t);

    vec4 old_color = texture(u_old, v_uv);
    vec4 new_color = texture(u_new, v_uv);
    f_color = mix(new_color, old_color, mask);
}
