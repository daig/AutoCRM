export interface TicketData {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  tags: {
    tag: {
      id: string;
      name: string;
      type_id: string;
      tag_type: {
        name: string;
      }
    }
  }[];
  metadata: {
    field_type: {
      name: string;
      value_type: string;
    };
    field_value_text: string | null;
    field_value_int: number | null;
    field_value_float: number | null;
    field_value_bool: boolean | null;
    field_value_date: string | null;
    field_value_timestamp: string | null;
    field_value_user: { full_name: string } | null;
    field_value_ticket: { title: string } | null;
  }[];
} 