import { NextResponse } from "next/server";

const FEED_URL = "https://www.jpost.com/Rss/RssFeedsHeadlines.aspx";
const MAX_ITEMS = 5;

type RssItem = {
  title: string;
  link: string;
  pubDate?: string;
  description?: string;
  imageUrl?: string;
};

const decodeEntities = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");

const stripCdata = (value: string) => value.replace(/^<!\[CDATA\[(.*)\]\]>$/s, "$1");

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const getTagValue = (itemXml: string, tag: string) => {
  const match = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match?.[1]) return "";
  const raw = stripCdata(match[1].trim());
  return stripHtml(decodeEntities(raw));
};

const getAttributeValue = (xml: string, tag: string, attr: string) => {
  const match = xml.match(new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["'][^>]*>`, "i"));
  return match?.[1] || "";
};

const getImageUrl = (itemXml: string) => {
  const mediaContentUrl = getAttributeValue(itemXml, "media:content", "url");
  if (mediaContentUrl) return mediaContentUrl;

  const mediaThumbUrl = getAttributeValue(itemXml, "media:thumbnail", "url");
  if (mediaThumbUrl) return mediaThumbUrl;

  const enclosureUrl = getAttributeValue(itemXml, "enclosure", "url");
  const enclosureType = getAttributeValue(itemXml, "enclosure", "type");
  if (enclosureUrl && enclosureType.toLowerCase().startsWith("image/")) {
    return enclosureUrl;
  }

  const imageTagMatch = itemXml.match(/<image[^>]*>([\s\S]*?)<\/image>/i);
  if (imageTagMatch?.[1]) {
    const imageUrl = getTagValue(imageTagMatch[1], "url");
    if (imageUrl) return imageUrl;
  }

  return "";
};

export async function GET() {
  try {
    const response = await fetch(FEED_URL, {
      headers: {
        "User-Agent": "HeBrew/1.0 (RSS reader)",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch RSS feed" },
        { status: 502 }
      );
    }

    const xml = await response.text();
    const itemsXml = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

    const items: RssItem[] = itemsXml.slice(0, MAX_ITEMS).map((item) => {
      const title = getTagValue(item, "title");
      const link = getTagValue(item, "link");
      const pubDate = getTagValue(item, "pubDate");
      const description = getTagValue(item, "description");
      const imageUrl = getImageUrl(item);
      return { title, link, pubDate, description, imageUrl: imageUrl || undefined };
    }).filter((item) => item.title && item.link);

    return NextResponse.json({
      source: "jpost",
      feedUrl: FEED_URL,
      items,
    });
  } catch (error: any) {
    console.error("Error fetching RSS feed:", error);
    return NextResponse.json(
      { error: "Failed to fetch RSS feed", details: error.message },
      { status: 500 }
    );
  }
}
