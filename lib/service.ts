import { Injectable, OnModuleInit } from "@nestjs/common";
import { FacebookClient } from "./clients/facebook";
import { GoogleClient } from "./clients/google";
import { LinkedinClient } from "./clients/linkedin";
import { OauthClient } from "./interfaces";
import { OauthMetadata } from "./metadata";

@Injectable()
export class OauthService implements OnModuleInit {
  static clients: Record<string, OauthClient>;

  onModuleInit() {
    const { clients } = OauthMetadata.getData();
    const { facebook, google, linkedin } = clients;
    OauthService.clients = {};
    if (facebook) {
      OauthService.clients["facebook"] = new FacebookClient(facebook);
    }
    if (google) {
      OauthService.clients["google"] = new GoogleClient(google);
    }
    if (linkedin) {
      OauthService.clients["linkedin"] = new LinkedinClient(linkedin);
    }
  }
}
