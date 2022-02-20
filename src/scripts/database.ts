import type { Connection, ConnectionInfo, World } from "./world";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  DocumentData,
  QueryDocumentSnapshot,
  Firestore,
  getDoc,
} from "firebase/firestore";
import { firebaseConfig } from "../config";

export let database: Database;
export async function TryPassword(password: string): Promise<boolean> {
  database = new Database();
  return await database.initialize(password);
}

export class Database {
  key: string;

  db: Firestore;
  world: World;

  constructor() {
    const firebaseApp = initializeApp(firebaseConfig);
    this.db = getFirestore(firebaseApp);
  }

  public async initialize(key: string): Promise<boolean> {
    this.key = key;

    if ((await this.checkPassword()) == false) {
      return false;
    }

    onSnapshot(
      collection(this.db, this.getCollectionName("connections")),
      (snapshot) => {
        let connections = [];
        snapshot.docs.map((doc) => {
          let connection = this.getConnectionFromDocData(doc);
          if (connection != null) {
            connections.push(connection);
          }
        });

        this.world.Reload(connections);
      }
    );

    return true;
  }

  private getCollectionName(collectionName: string): string {
    return collectionName + "/" + this.key + "/" + collectionName;
  }

  public onUpdate(world: World) {
    this.world = world;
  }

  public async saveConnection(connection: Connection) {
    await addDoc(collection(this.db, this.getCollectionName("connections")), {
      id: connection.id,
      start: connection.start.zone.name,
      end: connection.end.zone.name,
      type: connection.type,
      endtime: connection.endTime,
    });
  }

  public async loadConnections() {
    const snapshot = await getDocs(
      collection(this.db, this.getCollectionName("connections"))
    );

    let connections = [];
    for (let i = 0; i < snapshot.docs.length; i++) {
      let connection = this.getConnectionFromDocData(snapshot.docs[i]);
      if (connection != null) {
        connections.push(connection);
      }
    }

    return connections;
  }

  public async deleteConnection(connection: Connection) {
    let connections: QueryDocumentSnapshot<DocumentData>[] =
      await this.getConnectionsAsDocs();
    for (let i = 0; i < connections.length; i++) {
      let conn = connections[i];

      if (conn.data().id === connection.id) {
        const ref = doc(
          this.db,
          this.getCollectionName("connections"),
          conn.id
        );
        await deleteDoc(ref);
        return;
      }
    }
  }

  private async getConnectionsAsDocs(): Promise<
    QueryDocumentSnapshot<DocumentData>[]
  > {
    const snapshot = await getDocs(
      collection(this.db, this.getCollectionName("connections"))
    );
    return snapshot.docs;
  }

  private getConnectionFromDocData(
    doc: QueryDocumentSnapshot<DocumentData>
  ): ConnectionInfo {
    if (doc.id == "39a2P8HcPR14DarKfIzD") return null;

    const data = doc.data();
    return {
      id: data.id,
      start: data.start,
      end: data.end,
      type: data.type,
      endTime: data.endtime,
    };
  }

  public async checkPassword(): Promise<boolean> {
    if(this.key == "") {
      return false;
    }
    
    const document = await getDoc(doc(this.db, "passwords", this.key));

    if (document.data() != null) {
      return true;
    }

    return false;
  }

  public async setPassword(password: string) {
    await deleteDoc(doc(this.db, "passwords", this.key));

    let snapshot = await getDocs(collection(this.db, this.getCollectionName("connections")));
    for(let i = 0; i < snapshot.docs.length; i++) {
      await deleteDoc(snapshot.docs[i].ref);
    }
    await deleteDoc(doc(this.db, "connections", this.key));

    this.key = password;
    await setDoc(doc(collection(this.db, "passwords"), this.key), {});

    for (let i = 0; i < this.world.connections.length; i++) {
      this.saveConnection(this.world.connections[i]);
    }
  }
}
