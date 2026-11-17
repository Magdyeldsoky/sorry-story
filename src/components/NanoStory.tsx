"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Edit3,
  Heart,
  ImagePlus,
  Loader2,
  MessageSquareHeart,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface NanoStoryProps {
  paragraphs: string[];
}

interface MemoryItem {
  id: string;
  image: string;
  caption: string;
  date: string;
  createdAt: number;
}

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const targetWidth = Math.min(MAX_WIDTH, img.width);
        const scaleSize = targetWidth / img.width;
        canvas.width = targetWidth;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      };
    };
  });
};

export default function NanoStory({ paragraphs }: NanoStoryProps) {
  let globalWordIndex = 0;

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successText, setSuccessText] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [date, setDate] = useState("");

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement | null>(null);

  const showSuccess = (text: string) => {
    setSuccessText(text);
    setTimeout(() => setSuccessText(""), 4000);
  };

  const fetchMemories = async () => {
    try {
      const res = await fetch(`/api/memories?t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const formatted = data
          .filter((item: any) => item.id && (item.caption || item.image))
          .map((item: any, index: number) => ({
            id: item.id ? String(item.id) : String(index + Date.now()),
            image: item.image || "",
            caption: item.caption || item.message || "",
            date: item.date || "",
            createdAt: item.createdAt ? Number(item.createdAt) : Date.now(),
          }));
        setMemories([...formatted].reverse());
      }
    } catch (err) {
      console.error("Could not fetch memories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const postToSheet = async (payload: Record<string, unknown>) => {
    const SHEET_API_URL = process.env.NEXT_PUBLIC_SHEET_API_URL || "";
    await fetch(SHEET_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setImagePreview(compressed);
  };

  const resetForm = () => {
    setEditingId(null);
    setImagePreview("");
    setCaption("");
    setDate("");
  };

  const handleEditClick = (item: MemoryItem) => {
    setConfirmDeleteId(null);
    setEditingId(item.id);
    setImagePreview(item.image);
    setCaption(item.caption);
    const formattedDate = item.date ? String(item.date).split("T")[0] : "";
    setDate(formattedDate);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await postToSheet({ action: "delete", id });
      setMemories((prev) => prev.filter((m) => m.id !== id));
      if (editingId === id) resetForm();
      setConfirmDeleteId(null);
      setDeletingId(null);
      showSuccess("تم مسح البوست من الألبوم نهائياً");
      setTimeout(() => {
        fetchMemories();
      }, 2500);
    } catch (err) {
      console.error("Error deleting memory:", err);
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview && !caption.trim()) return;

    setSubmitting(true);
    const today = new Date().toISOString().split("T")[0];
    const finalDate = date.trim() !== "" ? date : today;
    const currentTime = Date.now();
    const wasEditing = Boolean(editingId);

    const payload = {
      action: editingId ? "update" : "create",
      id: editingId || currentTime.toString(),
      image: imagePreview,
      caption,
      date: finalDate,
      createdAt: currentTime,
    };

    try {
      await postToSheet(payload);
      setTimeout(() => {
        fetchMemories();
        resetForm();
        setSubmitting(false);
        showSuccess(
          wasEditing
            ? "تم تعديل البوست بنجاح ❤️"
            : "تم حفظ البوست في الألبوم بنجاح ❤️"
        );
      }, 2000);
    } catch (err) {
      console.error("Error saving memory:", err);
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      dir="rtl"
      className="min-h-screen relative overflow-hidden"
    >
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />

      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 sm:px-6 py-10 sm:py-14 space-y-12 sm:space-y-16">
        
        {/* 1. كارت الرسالة الأساسية (ملموم، غير عريض، يظهر مرة واحدة) */}
        <motion.section 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6 text-center sm:text-right"
        >
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div className="flex items-center gap-2 text-primary text-sm sm:text-base font-bold mx-auto sm:mx-0">
              <Sparkles className="w-4 h-4" />
              <span>رسالة من القلب</span>
            </div>
            <Heart className="w-5 h-5 text-primary fill-primary/30 animate-pulse hidden sm:block" />
          </div>

          <div className="space-y-5 text-base sm:text-lg leading-[2.2] text-foreground/90 font-medium">
            {paragraphs.map((paragraph, pIdx) => {
              const words = paragraph.split(" ");
              return (
                <p key={pIdx} className="flex flex-wrap justify-center sm:justify-start gap-x-2 gap-y-1">
                  {words.map((word, wIdx) => {
                    const currentDelay = globalWordIndex * 0.05;
                    globalWordIndex++;
                    const randomX = ((wIdx * 17) % 20) - 10;
                    const randomY = ((pIdx * 13 + wIdx) % 16) - 8;

                    return (
                      <motion.span
                        key={`${pIdx}-${wIdx}`}
                        initial={{ opacity: 0, x: randomX, y: randomY, scale: 1.2, filter: "blur(6px)" }}
                        animate={{ opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }}
                        transition={{ duration: 0.4, delay: currentDelay, ease: [0.22, 1, 0.36, 1] }}
                        className="relative inline-block"
                      >
                        {word}
                      </motion.span>
                    );
                  })}
                </p>
              );
            })}
          </div>
        </motion.section>

        {/* فاصل توضيحي لمكان البوستات والذكريات */}
        <div className="text-center space-y-2 pt-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full text-primary text-xs font-bold">
            <MessageSquareHeart className="w-4 h-4" />
            <span>مساحة البوستات وذكرياتنا المشتركة</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            ألبوم ذكرياتنا الحلوة 📸❤️
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
            هنا مكان البوستات واللحظات اللي بنوثقها سوا... تقدري تضيفي أو تعدلي أي ذكرى في أي وقت.
          </p>
        </div>

        {/* 2. ألبوم الذكريات والبوستات */}
        <section className="space-y-8">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
            </div>
          ) : memories.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground border-2 border-dashed border-border rounded-3xl bg-card/40">
              <ImagePlus className="w-8 h-8 text-primary/70" />
              <p className="text-sm">لسه مفيش بوستات أو ذكريات، ابدأ بأول ذكرى من الفورم أدناه</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {memories.map((item) => {
                const isConfirming = confirmDeleteId === item.id;
                const isDeleting = deletingId === item.id;
                
                // معالجة الصورة لضمان عرضها كصورة حقيقية وليست ككتابات Base64
                const imageSrc = item.image 
                  ? (item.image.startsWith("data:image") ? item.image : `data:image/jpeg;base64,${item.image}`) 
                  : "";

                return (
                  <motion.article
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-card/90 backdrop-blur-md border rounded-3xl overflow-hidden shadow-lg flex flex-col group transition-colors ${
                      editingId === item.id ? "border-primary/60" : "border-border"
                    }`}
                  >
                    {imageSrc && (
                      <div className="relative w-full aspect-video bg-muted overflow-hidden">
                        <img
                          src={imageSrc}
                          alt={item.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="p-5 flex-1 flex flex-col gap-4">
                      <p className="flex-1 text-base sm:text-lg font-medium text-foreground leading-relaxed whitespace-pre-line break-words">
                        {item.caption}
                      </p>

                      <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground min-h-[2.5rem]">
                        {isConfirming ? (
                          <>
                            <span className="font-semibold text-destructive">مسح البوست ده؟</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                disabled={isDeleting}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive text-white font-semibold cursor-pointer disabled:opacity-60 text-xs"
                              >
                                {isDeleting ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                                <span>تأكيد</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                disabled={isDeleting}
                                className="px-3 py-1.5 rounded-lg border border-border text-foreground cursor-pointer hover:bg-accent/40 text-xs"
                              >
                                إلغاء
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="flex items-center gap-1.5 font-mono text-xs">
                              <Calendar className="w-3.5 h-3.5 text-primary" />
                              {item.date ? String(item.date).split("T")[0] : ""}
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditClick(item)}
                                className="flex items-center gap-1 text-primary font-semibold cursor-pointer bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-lg border border-primary/20 transition-colors text-xs"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>تعديل</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(item.id)}
                                aria-label="مسح البوست"
                                className="flex items-center gap-1 text-destructive font-semibold cursor-pointer bg-destructive/10 hover:bg-destructive/15 px-3 py-1.5 rounded-lg border border-destructive/20 transition-colors text-xs"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>مسح</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}

          {successText && (
            <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-xs sm:text-sm">{successText}</span>
            </div>
          )}
        </section>

        {/* 3. فورم إضافة / تعديل بوست أو ذكرى جديدة */}
        <section>
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className={`bg-card/95 backdrop-blur-xl border rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 transition-colors ${
              editingId ? "border-primary/60" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/60">
              <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <MessageSquareHeart className="w-4.5 h-4.5 text-primary" />
                <span>{editingId ? "تعديل البوست ✏️" : "أضف بوست أو ذكرى جديدة ✨"}</span>
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-1 text-xs text-destructive hover:underline cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  إلغاء التعديل
                </button>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-foreground">صورة البوست</label>
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-border rounded-2xl cursor-pointer bg-background/50 hover:bg-accent/30 transition-colors overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-1.5">
                    <ImagePlus className="w-7 h-7 text-primary" />
                    <span className="text-xs sm:text-sm">اضغط لاختيار صورة من جهازك</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-foreground">اكتب الكلام أو التفاصيل هنا</label>
              <textarea
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="اكتب هنا التفاصيل أو الشعور في اللحظة دي..."
                className="w-full rounded-xl bg-background border border-input px-4 py-3 text-sm sm:text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-medium text-foreground">التاريخ</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl bg-background border border-input px-4 py-2.5 text-sm sm:text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                لو تركته فارغاً سيتم تسجيل تاريخ اليوم تلقائياً
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-md hover:opacity-95 transition-all cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>جاري النشر والحفظ...</span>
                </>
              ) : (
                <>
                  <Send className="w-4.5 h-4.5" />
                  <span>{editingId ? "حفظ التعديلات" : "نشر البوست في الألبوم ❤️"}</span>
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </motion.div>
  );
}