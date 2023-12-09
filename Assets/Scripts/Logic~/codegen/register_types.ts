import { TypeStore } from "@needle-tools/engine"

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
import { GameManager } from "../Jam/GameManager.js";
import { Gun } from "../Jam/Gun.js";
import { Pig } from "../Jam/Pig.js";

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
TypeStore.add("GameManager", GameManager);
TypeStore.add("Gun", Gun);
TypeStore.add("Pig", Pig);
