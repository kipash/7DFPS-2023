import { Behaviour, serializable } from "@needle-tools/engine";
import { Mesh, Object3D, Vector3 } from "three";
import { Pathfinding } from 'three-pathfinding';

export class NavMesh extends Behaviour {

    static Pathfinding?: Pathfinding;

    static IsOnNavMesh(position: Vector3): boolean {
        return NavMesh.Pathfinding.getGroup(NavMesh.ZONE, position, false) != null;
    }
    static FindPath(from: Vector3, to: Vector3, fallbackFrom: Vector3 | null = null): Vector3[] {
        let path = NavMesh.findPath(from, to);

        if(!path && fallbackFrom) {
            path = NavMesh.findPath(fallbackFrom, to);
        }

        // get nearest node
        const groupID = NavMesh.Pathfinding.getGroup(NavMesh.ZONE, from, false);
        if(!path && groupID) {
            const nearNode = NavMesh.Pathfinding.getClosestNode(from, NavMesh.ZONE, groupID, true);    
            //const farNode = NavMesh.Pathfinding.getClosestNode(from, NavMesh.ZONE, groupID, true);

            if(nearNode) {
                path = NavMesh.findPath(nearNode, to);
            }
        }

        return path;
    }

    private static findPath(from: Vector3, to: Vector3): Vector3[] {
        const groupID = NavMesh.Pathfinding.getGroup(NavMesh.ZONE, from);
        const path = NavMesh.Pathfinding.findPath(from, to, NavMesh.ZONE, groupID);
        
        if(path) 
            path.unshift(from);

        return path;
    }

    static ZONE = 'default';

    @serializable(Object3D)
    navMesh?: Object3D;

    awake(): void {
        if(!this.navMesh) return;

        // Create level.
        const pathfinding = NavMesh.Pathfinding ??= new Pathfinding();

        if (this.navMesh instanceof Mesh) {
            const zoneData = Pathfinding.createZone(this.navMesh.geometry);
            pathfinding.setZoneData(NavMesh.ZONE, zoneData);
            console.log(`Adding ${NavMesh.ZONE} to pathfinding`, zoneData);
        }
    }
}