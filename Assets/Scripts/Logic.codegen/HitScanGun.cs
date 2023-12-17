// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class HitScanGun : Needle.Typescript.GeneratedComponents.Gun
	{
		public float @maxDistance = 150f;
		public float @damage = 64f;
		public Needle.Typescript.GeneratedComponents.PlayAudio @shootSFX;
		public float @fireRate = 0f;
		public float @accuracyNoise = 1f;
		public UnityEngine.GameObject @fakeProjectilePrefab;
		public float @fakeProjectileSpeed = 100f;
		public void awake(){}
		public void onDestroy(){}
		public void update(){}
		public void fireVisually(UnityEngine.Vector3 @origin, UnityEngine.Vector3 @fwd, UnityEngine.Vector3 @impactPos, UnityEngine.Vector3 @impactNorm){}
		public void firePhysicially(UnityEngine.Vector3 @origin, UnityEngine.Vector3 @fwd){}
		public void fire(){}
	}
}

// NEEDLE_CODEGEN_END