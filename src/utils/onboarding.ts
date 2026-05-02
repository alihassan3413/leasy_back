import type { UserRole } from "@/types";

export function getOnBoardingRouteName(role: UserRole): string {
    switch (role) {
        case "B2B":
            return "register-company";
        case "WORKSHOP":
            return "register-workshop";
        case "B2C":
            return "b2c-register";
        default:
            return "dashboard";
    }
}