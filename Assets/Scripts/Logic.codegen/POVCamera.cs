// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class POVCamera : Needle.Typescript.GeneratedComponents.PlayerCamera
	{
		public UnityEngine.Vector2 @distance = new UnityEngine.Vector2(0.4f, 6f);
		public float @startDistance = 4f;
		public UnityEngine.Vector3 @offset = new UnityEngine.Vector3(0f, 1.6f, 0f);
		[UnityEngine.Tooltip("Clamp the up-down rotation of the camera")]
		public UnityEngine.Vector2 @xRotClamp = new UnityEngine.Vector2(-89, 89f);
		public float @lookSensitivity = 4f;
		public float @zoomSensitivity = 0.005f;
		public bool @enableFOVBoost = true;
		public float @sprintFOVSpeed = 5f;
		public float @sprintVelocityThreshold = 6f;
		public float @thirdPersonFovIncrease = 10f;
		public float @thirdPersonFov = 60f;
		public float @firstPersonFov = 80f;
		public float @zoomSmoothing = 10f;
		public bool @enableLineOfSight = true;
		public float @lineOfSightOffset = 0.5f;
		public void initialize(Needle.Typescript.GeneratedComponents.Player @character){}
		public void onDestroy(){}
		public void onDynamicallyConstructed(){}
		public void moduleOnBeforeRender(){}
		public void handleZoom(float @scrollDelta){}
		public void handleLook(float @lookX, float @lookY){}
		public void handleLineOfSight(){}
		public void handleFOVBoost(){}
		public void setLook(float @x, float @y){}
		public void addLook(float @dX, float @dY){}
		public void switchPerson(Needle.Engine.Components.Experimental.ViewModeFlags @mode){}
		public void restoreDefault(){}
	}
}

// NEEDLE_CODEGEN_END