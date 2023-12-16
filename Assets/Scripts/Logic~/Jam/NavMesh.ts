import { Behaviour, Gizmos, serializable } from "@needle-tools/engine";
import { Mesh, Object3D, Vector3 } from "three";
import { Pathfinding } from 'three-pathfinding';

export class NavMesh extends Behaviour {

    static Pathfinding?: Pathfinding;
    static ZoneData?: any;

    static IsOnNavMesh(position: Vector3): boolean {
        return NavMesh.Pathfinding.getGroup(NavMesh.ZONE, position, false) != null;
    }
    
    static FindPath(from: Vector3, to: Vector3): Vector3[] {
        let a = from;
        let b = to;

        let path = NavMesh.findPath(a, b);

        // invalid a, b
        if (!path) {
            let addFrom = false;
            if (!NavMesh.isPointOnNavMesh(a)) {
                //addFrom = true;
                const fixedA = NavMesh.getClosestVertex(from)!;
                if (fixedA) {
                    a = fixedA;
                    Gizmos.DrawLine(from, a, 0xff00ff, 0.5, false);
                }
                /* else
                    console.log("No A"); */
            }

            let addTo = false;
            if (!NavMesh.isPointOnNavMesh(b)) {
                //addTo = true;
                const fixedB = NavMesh.getClosestVertex(to) ?? to;
                if (fixedB) {
                    b = fixedB;
                    Gizmos.DrawLine(to, b, 0xff8800, 1, false);
                }
                /* else
                    console.log("No B"); */
            }

            path = NavMesh.findPath(a, b);

            if (path) {
                if (addFrom)
                    path.unshift(from);
                if (addTo)
                    path.push(to);
            }
        }

        console.log("Find path. From: ", from.x.toFixed(1), from.y.toFixed(1), from.z.toFixed(1), " | To: ", to.x.toFixed(1), to.y.toFixed(1), to.z.toFixed(1), " | Result: ", path?.length);

        // get nearest node

        return path;
    }

    static isPointOnNavMesh(point: Vector3): boolean {

        const vertices = NavMesh.ZoneData?.vertices;
        const groups = NavMesh.ZoneData?.groups;

        let isContained = false;

        if (groups === undefined || vertices === undefined) 
            return false;

        for (const node of groups) {
            if (NavMesh.isPointInGroup(point, node, vertices)) {
                isContained = true;
                break;
            }
        }
        return isContained;
    }

    static isPointInGroup(point: Vector3, group: Array<any>, vertices: Array<Vector3>) {
        let isContained = false;
        for (const poly of group) {
            if (NavMesh.isPointInPoly(point, poly, vertices)) {
                isContained = true
                break;
            }
        }

        return isContained;
    }

    static isPointInPoly(point: Vector3, poly: any, vertices: Array<Vector3>): boolean {
        // reference point will be the centroid of the polygon
        // We need to rotate the vector as well as all the points which the polygon uses
    
        var lowestPoint = 100000;
        var highestPoint = -100000;
    
        var polygonVertices: Array<Vector3> = [];
        poly.vertexIds.forEach((vId: number) => {
          lowestPoint = Math.min(vertices[vId].y, lowestPoint);
          highestPoint = Math.max(vertices[vId].y, highestPoint);
          polygonVertices.push(vertices[vId]);
        });
    
        if (point.y < highestPoint + 0.5 && point.y > lowestPoint - 0.5 &&
          this.isVectorInPolygon(polygonVertices, point)) {
          return true;
        }
        return false;
    }

    //+ Jonas Raoni Soares Silva
    //@ http://jsfromhell.com/math/is-point-in-poly [rev. #0]
    static isVectorInPolygon (poly, pt): boolean {
        for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
        ((poly[i].z <= pt.z && pt.z < poly[j].z) || (poly[j].z <= pt.z && pt.z < poly[i].z)) && (pt.x < (poly[j].x - poly[i].x) * (pt.z - poly[i].z) / (poly[j].z - poly[i].z) + poly[i].x) && (c = !c);
        return c;
    }

    private static getClosestVertex(position: Vector3): Vector3 | null {
        let minDistance = Number.MAX_SAFE_INTEGER;
        let safePosition: Vector3 | null = null;
        NavMesh.ZoneData?.groups.forEach(group => {
            group.forEach(poly => {
                const center = (poly.centroid as Vector3);
                if (center) {
                    const dis = center.distanceToSquared(position);
                    if (minDistance > dis) {
                        minDistance = dis;
                        safePosition = center;
                    } 
                }
            });
        });

        return safePosition;
    }

    private static findPath(from: Vector3, to: Vector3): Vector3[] {
        const groupID = NavMesh.Pathfinding.getGroup(NavMesh.ZONE, from);
        const path = NavMesh.Pathfinding.findPath(from, to, NavMesh.ZONE, groupID);

        if (path)
            path.unshift(from);

        return path;
    }

    static ZONE = 'default';

    @serializable(Object3D)
    navMesh?: Object3D;

    awake(): void {
        if (!this.navMesh) return;

        // Create level.
        const pathfinding = NavMesh.Pathfinding ??= new Pathfinding();

        if (this.navMesh instanceof Mesh) {
            const zoneData = NavMesh.ZoneData = Pathfinding.createZone(this.navMesh.geometry);
            pathfinding.setZoneData(NavMesh.ZONE, zoneData);
            /* console.log(`Adding ${NavMesh.ZONE} to pathfinding`, zoneData); */
        }
    }
}