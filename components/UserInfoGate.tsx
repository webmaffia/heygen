"use client";

import React, { useEffect, useMemo, useState } from "react";

type UserInfo = {
	name: string;
	email: string;
	phone: string;
};

type UserInfoGateProps = {
	children: React.ReactNode;
	storageKey?: string;
};

const DEFAULT_STORAGE_KEY = "interactive-avatar:user-info";

function isValidEmail(email: string): boolean {
	return /.+@.+\..+/.test(email);
}

function isValidPhone(phone: string): boolean {
	// Accept digits, spaces, +, -, (), and must have at least 7 digits
	const digits = (phone.match(/\d/g) || []).length;
	return digits >= 7;
}

export default function UserInfoGate({ children, storageKey = DEFAULT_STORAGE_KEY }: UserInfoGateProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [storedUserInfo, setStoredUserInfo] = useState<UserInfo | null>(null);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		try {
			const raw = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
			if (raw) {
				const parsed = JSON.parse(raw) as UserInfo;
				if (parsed?.name && parsed?.email && parsed?.phone) {
					setStoredUserInfo(parsed);
				}
			}
		} catch {
			// ignore malformed localStorage
		}
		setIsLoading(false);
	}, [storageKey]);

	const canSubmit = useMemo(() => {
		return name.trim().length > 1 && isValidEmail(email.trim()) && isValidPhone(phone.trim());
	}, [name, email, phone]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		if (!canSubmit) {
			setError("Please enter a valid name, email, and phone number.");
			return;
		}
		const payload: UserInfo = { name: name.trim(), email: email.trim(), phone: phone.trim() };
		try {
			window.localStorage.setItem(storageKey, JSON.stringify(payload));
		} catch (err) {
			setError("Failed to save your info locally. Please check browser settings.");
			return;
		}

		// Send to server to append into data/users.json
		try {
			await fetch("/api/users", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
		} catch {
			// Ignore network/server errors; proceed with local gating
		}

		setStoredUserInfo(payload);
	}

	if (isLoading) {
		return (
			<div className="w-full flex items-center justify-center py-10">
				<div className="text-sm text-gray-500">Loading...</div>
			</div>
		);
	}

	if (storedUserInfo) {
		return <>{children}</>;
	}

	return (
		<div className="w-full max-w-xl mx-auto bg-white/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
			<h2 className="text-lg font-semibold mb-4">Tell us about you</h2>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label className="block text-sm font-medium mb-1" htmlFor="name">Name</label>
					<input
						id="name"
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Jane Doe"
						autoComplete="name"
						required
					/>
				</div>
				<div>
					<label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
					<input
						id="email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="jane@example.com"
						autoComplete="email"
						required
					/>
				</div>
				<div>
					<label className="block text-sm font-medium mb-1" htmlFor="phone">Phone</label>
					<input
						id="phone"
						type="tel"
						value={phone}
						onChange={(e) => setPhone(e.target.value)}
						className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="+1 555 123 4567"
						autoComplete="tel"
						required
					/>
				</div>
				{error ? <p className="text-sm text-red-600">{error}</p> : null}
				<button
					type="submit"
					disabled={!canSubmit}
					className="inline-flex items-center justify-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
				>
					Continue
				</button>
			</form>
		</div>
	);
}


