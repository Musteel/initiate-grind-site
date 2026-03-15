import { redirect } from "next/navigation";
import { fetchUserProfile } from "@/lib/supabase/server";


export async function Page() {
    const profile = await fetchUserProfile();

    if (!profile) {
        redirect("/login");
    }

    if (profile.role !== "admin" && profile.role !== "moderator") {
        redirect("/profile");
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
            <p className="text-lg text-gray-600">This is the admin dashboard page.</p>
        </div>
    );
};

export default Page;


