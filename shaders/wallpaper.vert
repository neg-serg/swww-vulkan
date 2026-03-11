#version 450

layout(location = 0) out vec2 v_uv;

// Fullscreen quad from vertex index (no vertex buffer needed)
// Vertices: 0=(0,0), 1=(2,0), 2=(0,2) — forms a triangle covering the screen
void main() {
    v_uv = vec2((gl_VertexIndex << 1) & 2, gl_VertexIndex & 2);
    gl_Position = vec4(v_uv * 2.0 - 1.0, 0.0, 1.0);
}
