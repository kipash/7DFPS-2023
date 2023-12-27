// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class WaveManager : UnityEngine.MonoBehaviour
	{
		public Needle.Typescript.GeneratedComponents.GameManager @gameManager;
		public float @unitInterval = 2f;
		public float @unitCount = 10f;
		public float @delayWaveStart = 2f;
		public float @delayBetweenWaves = 10f;
		public UnityEngine.UI.Text @waveLabel;
		public Needle.Typescript.GeneratedComponents.PlayAudio @waveStartAudio;
		public Needle.Typescript.GeneratedComponents.PlayAudio @waveFinishedAudio;
		public Needle.Typescript.GeneratedComponents.PlayAudio @gameOver;
		public void awake(){}
		public void spawnWave(){}
	}
}

// NEEDLE_CODEGEN_END


namespace Needle.Typescript.GeneratedComponents
{
    public partial class WaveManager : UnityEngine.MonoBehaviour
    {
        public UnityEngine.Events.UnityEvent<UnityEngine.GameObject> onEnemySpawned;
    }
}