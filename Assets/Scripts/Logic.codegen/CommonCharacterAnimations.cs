// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class CommonCharacterAnimations : Needle.Typescript.GeneratedComponents.PlayerModule
	{
		public UnityEngine.Animator @animator;
		public string @jumpName = "jump";
		public string @fallingName = "falling";
		public string @startFallName = "startFall";
		public float @fallAnimDelay = 0.2f;
		public string @idleName = "idling";
		public string @walkName = "walking";
		public string @sprintName = "sprinting";
		public string @speedMultiplier = "speedMultiplier";
		[UnityEngine.Tooltip("Minimum speed to enter walk animation")]
		public float @minWalkSpeed = 1f;
		[UnityEngine.Tooltip("Speed of the walk animation")]
		public float @baseWalkSpeed = 2f;
		[UnityEngine.Tooltip("Minimum speed to enter sprint animation")]
		public float @minSprintSpeed = 6f;
		[UnityEngine.Tooltip("Speed of the sprint animation")]
		public float @baseSprintSpeed = 5.25f;
		public bool @adjustWithScale = true;
		public void moduleOnBeforeRender(){}
	}
}

// NEEDLE_CODEGEN_END