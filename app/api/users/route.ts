import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

type UserInfo = {
	name: string;
	email: string;
	phone: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

async function ensureFile(): Promise<void> {
	try {
		await fs.mkdir(DATA_DIR, { recursive: true });
		await fs.access(DATA_FILE).catch(async () => {
			await fs.writeFile(DATA_FILE, "[]", "utf-8");
		});
	} catch (err) {
		throw new Error("Failed to prepare data file");
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json()) as Partial<UserInfo>;
		if (!body?.name || !body?.email || !body?.phone) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		await ensureFile();
		const raw = await fs.readFile(DATA_FILE, "utf-8");
		let list: Array<UserInfo & { createdAt: string }>; 
		try {
			list = JSON.parse(raw) as Array<UserInfo & { createdAt: string }>;
			if (!Array.isArray(list)) list = [];
		} catch {
			list = [];
		}

		const record = {
			name: String(body.name),
			email: String(body.email),
			phone: String(body.phone),
			createdAt: new Date().toISOString(),
		};
		list.push(record);
		await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");

		return NextResponse.json({ ok: true }, { status: 201 });
	} catch (err) {
		return NextResponse.json({ error: "Failed to save user" }, { status: 500 });
	}
}


