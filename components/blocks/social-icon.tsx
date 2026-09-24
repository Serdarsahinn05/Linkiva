import { Globe, Mail } from "lucide-react";
import type { ComponentType } from "react";
import { FaLinkedin } from "react-icons/fa6";
import { SiBehance, SiDiscord, SiDribbble, SiGithub, SiInstagram, SiSpotify, SiTiktok, SiTwitch, SiX, SiYoutube } from "react-icons/si";
import type { SocialPlatform } from "@/prisma/generated/enums";

type IconProps = { size?: number; className?: string; "aria-hidden"?: boolean };

// Brand marks from Simple Icons; LinkedIn is not in Simple Icons, so it comes from Font Awesome.
export const SOCIAL_ICONS: Record<SocialPlatform, ComponentType<IconProps>> = {
  INSTAGRAM: SiInstagram,
  X: SiX,
  TIKTOK: SiTiktok,
  YOUTUBE: SiYoutube,
  GITHUB: SiGithub,
  LINKEDIN: FaLinkedin,
  TWITCH: SiTwitch,
  SPOTIFY: SiSpotify,
  DISCORD: SiDiscord,
  BEHANCE: SiBehance,
  DRIBBBLE: SiDribbble,
  WEBSITE: (props) => <Globe strokeWidth={1.75} {...props} />,
  EMAIL: (props) => <Mail strokeWidth={1.75} {...props} />,
};
