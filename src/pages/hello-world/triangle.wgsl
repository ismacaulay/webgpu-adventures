
struct VertexOutput {
  @builtin(position) position: vec4<f32>;
  @location(0) frag_colour: vec4<f32>;
};


@stage(vertex)
fn vertex_main(@location(0) position: vec3<f32>, @location(1) color: vec3<f32>) -> VertexOutput {
    var out: VertexOutput;

    out.position = vec4<f32>(position, 1.0);
    out.frag_colour = vec4<f32>(color, 1.0);
    return out;
}

@stage(fragment)
fn fragment_main(@location(0) frag_colour: vec4<f32>) -> @location(0) vec4<f32> {
    return frag_colour;
}