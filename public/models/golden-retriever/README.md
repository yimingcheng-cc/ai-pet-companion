# Golden retriever model contract

Supply a commercially licensed GLB or glTF with embedded textures and an animated,
anatomically plausible golden retriever. Set NEXT_PUBLIC_PET_MODEL_URL to its path,
e.g. /models/golden-retriever/pet.glb. No model is included or implied to be licensed.

Units: metres. Ground: y=0. Up: +Y. Facing: +Z. Suggested shoulder height: 0.6m.
Root origin: ground-centred. Keep scale transforms applied and bounds near the origin.
GLB with embedded textures is preferred. glTF dependencies must resolve on the same host.
Recommended maximum: 10MB; texture dimensions 2048px or lower for mobile.

Animation names (exact, case-sensitive): idle, look_at_user, blink, sit, lie_down,
sleep, wake_up, walk, tail_wag, eat, play, happy, curious, listen, speak.
The renderer detects and reports the actual clip names. It crossfades matching clips;
otherwise it falls back to idle if available and labels the unmatched action.
There is no procedural anatomical animation, automatic rig retargeting, bowl pathfinding,
audio-driven jaw animation, or phoneme lip-sync in this version.

Asset load failure returns to the clearly labelled photographic prototype.
Check mobile WebGL memory and animation quality on real devices before publishing.
Record creator, source URL, license, attribution and commercial-use permissions here
before introducing an asset. Camera and lighting live in model-scene.tsx.
