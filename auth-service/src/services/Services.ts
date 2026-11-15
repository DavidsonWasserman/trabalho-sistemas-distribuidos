import EnvVars from "@src/common/constants/env";
import IUserService from "./UserService/UserService";
import MainUserService from "./UserService/MainUserService";
import MockUserService from "./UserService/MockUserService";
import LocalUserService from "./UserService/LocalUserService";


export interface Services {
    UserService: IUserService
}

export function getServices(): Services {
    switch(EnvVars.NodeEnv) {
        case "development":
            return { UserService: LocalUserService }
        case "test":
            return { UserService: MockUserService }
        case "production":
            return { UserService: MainUserService }
    }
}
