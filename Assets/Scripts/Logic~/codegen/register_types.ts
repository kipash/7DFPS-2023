﻿import { TypeStore } from "@needle-tools/engine"

// Import types
import { GalleryCharacter } from "../Character/GalleryCharacter.js";
import { StandardCharacter } from "../Character/StandardCharacter.js";
import { PlayerCamera } from "../Character/Camera/PlayerCamera.js";
import { POVCamera } from "../Character/Camera/POVCamera.js";
import { DesktopCharacterInput } from "../Character/Input/DesktopCharacterInput.js";
import { Joystick } from "../Character/Input/Joystick.js";
import { MobileCharacterInput } from "../Character/Input/MobileCharacterInput.js";
import { PointerLock } from "../Character/Input/PointerLock.js";
import { SimplePointerInput } from "../Character/Input/SimplePointerInput.js";
import { CommonAvatar } from "../Character/Misc/CommonAvatar.js";
import { CommonCharacterAnimations } from "../Character/Misc/CommonCharacterAnimations.js";
import { CommonCharacterAudio } from "../Character/Misc/CommonCharacterAudio.js";
import { PointerVisualizer } from "../Character/Misc/PointerVisualizer.js";
import { CharacterPhysics } from "../Character/Physics/CharacterPhysics.js";
import { JumpPad } from "../Character/Physics/JumpPad.js";
import { Lift } from "../Character/Physics/Lift.js";
import { GalleryPhysics_Scheme } from "../Character/Physics/TeleportNavigation.js";
import { TeleportNavigation } from "../Character/Physics/TeleportNavigation.js";
import { Enemy } from "../Jam/Enemy.js";
import { GameManager } from "../Jam/GameManager.js";
import { HousePlayer } from "../Jam/HousePlayer.js";
import { NavMesh } from "../Jam/NavMesh.js";
import { Pig } from "../Jam/Pig.js";
import { PlayAudio } from "../Jam/PlayAudio.js";
import { ScaleUI } from "../Jam/ScaleUI.js";
import { SpawnSpotHandlerFixed } from "../Jam/SpawnSpotHandlerFixed.js";
import { UIManager } from "../Jam/UIManager.js";
import { WaveManager } from "../Jam/WaveManager.js";
import { FakeProjectile } from "../Jam/Guns/FakeProjectile.js";
import { GatlingGun } from "../Jam/Guns/GatlingGun.js";
import { Gun } from "../Jam/Guns/Gun.js";
import { HitScanGun } from "../Jam/Guns/HitScanGun.js";
import { Projectile } from "../Jam/Guns/Projectile.js";
import { ProjectileGun } from "../Jam/Guns/ProjectileGun.js";
import { SniperGun } from "../Jam/Guns/SniperGun.js";

// Register types
TypeStore.add("GalleryCharacter", GalleryCharacter);
TypeStore.add("StandardCharacter", StandardCharacter);
TypeStore.add("PlayerCamera", PlayerCamera);
TypeStore.add("POVCamera", POVCamera);
TypeStore.add("DesktopCharacterInput", DesktopCharacterInput);
TypeStore.add("Joystick", Joystick);
TypeStore.add("MobileCharacterInput", MobileCharacterInput);
TypeStore.add("PointerLock", PointerLock);
TypeStore.add("SimplePointerInput", SimplePointerInput);
TypeStore.add("CommonAvatar", CommonAvatar);
TypeStore.add("CommonCharacterAnimations", CommonCharacterAnimations);
TypeStore.add("CommonCharacterAudio", CommonCharacterAudio);
TypeStore.add("PointerVisualizer", PointerVisualizer);
TypeStore.add("CharacterPhysics", CharacterPhysics);
TypeStore.add("JumpPad", JumpPad);
TypeStore.add("Lift", Lift);
TypeStore.add("GalleryPhysics_Scheme", GalleryPhysics_Scheme);
TypeStore.add("TeleportNavigation", TeleportNavigation);
TypeStore.add("Enemy", Enemy);
TypeStore.add("GameManager", GameManager);
TypeStore.add("HousePlayer", HousePlayer);
TypeStore.add("NavMesh", NavMesh);
TypeStore.add("Pig", Pig);
TypeStore.add("PlayAudio", PlayAudio);
TypeStore.add("ScaleUI", ScaleUI);
TypeStore.add("SpawnSpotHandlerFixed", SpawnSpotHandlerFixed);
TypeStore.add("UIManager", UIManager);
TypeStore.add("WaveManager", WaveManager);
TypeStore.add("FakeProjectile", FakeProjectile);
TypeStore.add("GatlingGun", GatlingGun);
TypeStore.add("Gun", Gun);
TypeStore.add("HitScanGun", HitScanGun);
TypeStore.add("Projectile", Projectile);
TypeStore.add("ProjectileGun", ProjectileGun);
TypeStore.add("SniperGun", SniperGun);
