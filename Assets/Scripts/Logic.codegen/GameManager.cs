// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class GameManager : UnityEngine.MonoBehaviour
	{
		public UnityEngine.Transform @plinkyAsset;
		public UnityEngine.Transform @stinkyAsset;
		public UnityEngine.Transform @blinkyAsset;
		public UnityEngine.Transform @enemyAsset;
		public UnityEngine.GameObject @masterLabel;
		public void awake(){}
		public void start(){}
		public void OnEnable(){}
		public void OnDisable(){}
		public void startGame(){}
		public void selectCharacter(float @index){}
		public void spawnPlayer(){}
		public void update(){}
		public void spawnEnemy(){}
		public void spawnAsset(UnityEngine.Transform @asset){}
	}
}

// NEEDLE_CODEGEN_END

namespace Needle.Typescript.GeneratedComponents
{
    public partial class GameManager : UnityEngine.MonoBehaviour
    {
        public UnityEngine.Events.UnityEvent<UnityEngine.GameObject> onPlayerSpawned;
    }
}