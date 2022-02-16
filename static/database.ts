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
} from "firebase/firestore";
import { firebaseConfig } from "../config";

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

let world: World;
onSnapshot(collection(db, "connections"), (snapshot) => {
  let connections = [];
  snapshot.docs.map((doc) => {
    let connection = GetConnectionFromDocData(doc);
    if (connection != null) {
      connections.push(connection);
    }
  });

  world.Reload(connections);
});

export async function OnUpdate(wrld: World) {
  world = wrld;
}

export async function SaveConnection(connection: Connection) {
  await addDoc(collection(db, "connections"), {
    id: connection.id,
    start: connection.start.zone.name,
    end: connection.end.zone.name,
    type: connection.type,
    endtime: connection.endTime,
  });
}

export async function DeleteConnection(connection: Connection) {
  let connections: QueryDocumentSnapshot<DocumentData>[] =
    await GetConnectionsAsDocs();
  for (let i = 0; i < connections.length; i++) {
    let conn = connections[i];

    if (conn.data().id === connection.id) {
      const ref = doc(db, "connections", conn.id);
      await deleteDoc(ref);
      return;
    }
  }
}

export async function LoadConnections(): Promise<ConnectionInfo[]> {
  const snapshot = await getDocs(collection(db, "connections"));

  let connections = [];
  for (let i = 0; i < snapshot.docs.length; i++) {
    let connection = GetConnectionFromDocData(snapshot.docs[i]);
    if (connection != null) {
      connections.push(connection);
    }
  }

  return connections;
}

async function GetConnectionsAsDocs(): Promise<
  QueryDocumentSnapshot<DocumentData>[]
> {
  const snapshot = await getDocs(collection(db, "connections"));
  return snapshot.docs;
}

function GetConnectionFromDocData(
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

export async function GetPassword(): Promise<string> {
  const snapshot = await getDocs(collection(db, "passwords"));
  for (let i = 0; i < snapshot.docs.length; i++) {
    if (snapshot.docs[i].id == "password") {
      return snapshot.docs[i].data().password;
    }
  }

  throw new Error("Failed to get password.");
}

export async function SetPassword(password: string) {
  let passwordDoc = doc(db, "passwords", "password");
  await setDoc(passwordDoc, { password: password });
}
