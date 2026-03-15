import { redirect } from "next/navigation";
import { fetchUserProfile } from "@/lib/utils";

export async function Page() {
    const profile = await fetchUserProfile();

    if (!profile) {
        redirect("/login");
    }



    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-4xl font-bold mb-4">User Submissions</h1>
            <p className="text-lg text-gray-600">This is the submissions list page.</p>
            <p className="text-sm text-gray-500 mt-2">Welcome, {profile.display_name ?? profile.username}!</p>
        </div>
    );
};

export default Page;