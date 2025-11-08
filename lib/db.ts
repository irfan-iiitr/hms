import { MongoClient, type Collection, type Document } from "mongodb"

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://shobhitcodes247_db_user:FPQ4H6UsHJYeJ38Y@cluster0.xwazyvz.mongodb.net/?appName=Cluster0"

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!global._mongoClientPromise) {
  client = new MongoClient(uri)
  global._mongoClientPromise = client.connect()
}

clientPromise = global._mongoClientPromise

export async function getDb(dbName = "Cluster0") {
  const connectedClient = await clientPromise
  return connectedClient.db(dbName)
}

export async function getCollection<T extends Document = Document>(name: string): Promise<Collection<T>> {
  const db = await getDb()
  return db.collection<T>(name)
}


